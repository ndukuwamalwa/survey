import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class User {
    @Field()
    username: string;
}

@ObjectType()
export class LoginResponse {
    @Field()
    success: boolean;

    @Field()
    message: string;

    @Field({ nullable: true })
    token: string;
}
