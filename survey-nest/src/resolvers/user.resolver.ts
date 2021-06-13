import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "src/entities/user.entity";
import { LoginResponse, User } from "src/types/user.type";
import { Repository } from "typeorm";
import * as BCrypt from 'bcryptjs';
import { JwtService } from "@nestjs/jwt";

@Resolver(of => User)
export class UserResolver {
    constructor(
        @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
        private jwtService: JwtService
    ) { }

    @Query(returns => User)
    async user(
        @Args({ name: 'username', type: () => String }) username
    ): Promise<User> {
        const user = await this.userRepo.findOne({ username });
        return user;
    }

    @Query(returns => [User])
    async users(): Promise<Array<User>> {
        const users = await this.userRepo.find();
        return users;
    }

    @Mutation(returns => LoginResponse)
    async login(
        @Args({ type: () => String, name: 'username' }) username: string,
        @Args({ type: () => String, name: 'password' }) password: string
    ): Promise<LoginResponse> {
        const response = new LoginResponse();
        response.message = 'Invalid Username/Password';
        response.success = false;
        response.token = null;
        const user = await this.userRepo.findOne({ username });
        if (user) {
            if (BCrypt.compareSync(password, user.password)) {
                response.message = `Successful`;
                response.success = true;
                response.token = this.jwtService.sign({ username }, { expiresIn: '1h' });
            }
        }

        return response;
    }

    @Mutation(returns => String)
    async logout(
        @Args({ type: () => String, name: 'token' }) token: string
    ): Promise<string> {
        return 'Success';
    }
}
