import * as BCrypt from 'bcryptjs';

export class EncryptionService {
    static encryptPassword(plainTextPassword: string): string {
        return BCrypt.hashSync(plainTextPassword, 12);
    }

    static isCorrectPassword(plainText: string, cipherText: string): boolean {
        return BCrypt.compareSync(plainText, cipherText);
    }
}
