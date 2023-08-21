import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from './schemas/user.schemas';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { LogInDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { createDecipheriv, randomBytes, scrypt } from 'crypto';
import { SignUpDto } from './dto/signup.dto';
import {
  encryptData,
  encryptUserObject,
  createPCAES,
} from 'src/utils/ecryption';
import { promisify } from 'util';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ token: string }> {
    const { name, email, password, dateOfBirth, phoneNumber, gender } =
      signUpDto;
    const keySecret = randomBytes(24).toString();

    const user = await this.userModel.findOne({ email });
    if (user) {
      if (user.email && !user.keySecret) {
        await this.userModel.findOne({ email }).updateOne(
          { email },
          {
            $set: {
              name,
              email,
              password: '',
              keySecret,
              dateOfBirth,
              phoneNumber,
              gender,
              files: '',
            },
          },
        );
        await encryptUserObject(user, ['keySecret'], user._id, password);
        const { passwordAES } = await createPCAES(password, user._id);
        await this.userModel.updateOne({ email }, { password: passwordAES });
        const userS = await this.userModel.findOne({ email });
        const ids = userS.password.toString().search(`${userS._id}`);
        const paswordHash = userS.password.slice(0, ids - 20);
        const iv = Buffer.from(userS.password.slice(ids - 16, ids), 'binary');
        const coffeSalt = userS.password.slice(ids - 20, ids - 16);
        // Encrypt key secret
        const keySecretDec = (await promisify(scrypt)(
          paswordHash,
          coffeSalt,
          32,
        )) as Buffer;
        const decipherKeySecret = createDecipheriv(
          'aes-256-ctr',
          keySecretDec,
          iv,
        );
        const decryptedKeySecret = Buffer.concat([
          decipherKeySecret.update(Buffer.from(userS.keySecret, 'base64')),
          decipherKeySecret.final(),
        ]);
        // Encrypt file properties
        const keySecretFile = decryptedKeySecret.toString();
        const key = (await promisify(scrypt)(
          keySecretFile,
          coffeSalt,
          32,
        )) as Buffer;

        const phoneNumberr = encryptData(
          Buffer.from(phoneNumber),
          iv,
          key,
        ).toString();
        const genderr = encryptData(Buffer.from(gender), iv, key).toString();
        const dateOfBirthh = encryptData(
          Buffer.from(dateOfBirth),
          iv,
          key,
        ).toString();
        const filess = encryptData(
          Buffer.from(userS.files),
          iv,
          key,
        ).toString();

        userS.files = filess;
        userS.phoneNumber = phoneNumberr;
        userS.gender = genderr;
        userS.dateOfBirth = dateOfBirthh;
        await userS.save();

        const token = this.jwtService.sign({ id: userS._id });
        return { token };
      }
    } else {
      await this.userModel.create({
        name,
        email,
        password: '',
        keySecret,
        dateOfBirth,
        phoneNumber,
        gender,
        files: '',
      });
      const userSs = await this.userModel.findOne({ email });
      await encryptUserObject(userSs, ['keySecret'], userSs._id, password);
      const { passwordAES } = await createPCAES(password, userSs._id);
      await this.userModel.updateOne({ email }, { password: passwordAES });

      const userS = await this.userModel.findOne({ email });
      const ids = userS.password.toString().search(`${userS._id}`);
      const paswordHash = userS.password.slice(0, ids - 20);
      const iv = Buffer.from(userS.password.slice(ids - 16, ids), 'binary');
      const coffeSalt = userS.password.slice(ids - 20, ids - 16);
      // Encrypt key secret
      const keySecretDec = (await promisify(scrypt)(
        paswordHash,
        coffeSalt,
        32,
      )) as Buffer;
      const decipherKeySecret = createDecipheriv(
        'aes-256-ctr',
        keySecretDec,
        iv,
      );
      const decryptedKeySecret = Buffer.concat([
        decipherKeySecret.update(Buffer.from(userS.keySecret, 'base64')),
        decipherKeySecret.final(),
      ]);
      // Encrypt file properties
      const keySecretFile = decryptedKeySecret.toString();
      const key = (await promisify(scrypt)(
        keySecretFile,
        coffeSalt,
        32,
      )) as Buffer;

      const phoneNumberr = encryptData(
        Buffer.from(phoneNumber),
        iv,
        key,
      ).toString();
      const genderr = encryptData(Buffer.from(gender), iv, key).toString();
      const dateOfBirthh = encryptData(
        Buffer.from(dateOfBirth),
        iv,
        key,
      ).toString();
      const filess = encryptData(Buffer.from(userS.files), iv, key).toString();

      userS.files = filess;
      userS.phoneNumber = phoneNumberr;
      userS.gender = genderr;
      userS.dateOfBirth = dateOfBirthh;
      await userS.save();

      const token = this.jwtService.sign({ id: userS._id });
      return { token };
    }

    const token = this.jwtService.sign({ id: user._id });
    return { token };
  }

  async LogIn(LogInDto: LogInDto): Promise<{ token: string }> {
    const { email, password } = LogInDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Get information for decryption
    const ids = user.password.search(`${user._id}`);
    const passwordHash = user.password.slice(0, ids - 20);
    const isPasswordMatched = await bcrypt.compare(password, passwordHash);
    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ id: user._id });
    return { token };
  }

  async googleLogin(req) {
    if (!req.user) {
      return 'No user from google';
    }
    try {
      const user = await this.userModel.findOne({ email: req.user.email });
      if (user) {
        await this.userModel.findOne({ email: req.user.email }).updateOne({
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          picture: req.user.picture,
          isAdmin: false,
          isPublished: true,
        });
      } else {
        await this.userModel.create({
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          picture: req.user.picture,
          isAdmin: false,
          isPublished: true,
        });
      }
    } catch (error) {
      const token = req.user.accessToken;
      return { token };
    }

    const token = req.user.accessToken;
    return { token };
  }
}
