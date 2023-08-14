import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from './schemas/user.schemas';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { LogInDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { createDecipheriv, randomBytes, scrypt } from 'crypto';
import { SignUpDto } from './dto/signup.dto';
import { encryptData, encryptUserObject } from 'src/utils/ecryption';
import { createPCAES } from 'src/utils/ecryption';
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

    const user = await this.userModel.create({
      name,
      email,
      password: '',
      keySecret: keySecret,
      dateOfBirth,
      phoneNumber,
      gender,
      files: '',
    });

    await encryptUserObject(user, ['keySecret'], user._id, password);
    const { passwordAES } = await createPCAES(password, user._id);
    user.password = passwordAES;

    const ids = user.password.search(`${user._id}`);
    const paswordHash = user.password.slice(0, ids - 20);
    const iv = Buffer.from(user.password.slice(ids - 16, ids), 'binary');
    const coffeSalt = user.password.slice(ids - 20, ids - 16);
    // Encrypt key secret
    const keySecretDec = (await promisify(scrypt)(
      paswordHash,
      coffeSalt,
      32,
    )) as Buffer;
    const decipherKeySecret = createDecipheriv('aes-256-ctr', keySecretDec, iv);
    const decryptedKeySecret = Buffer.concat([
      decipherKeySecret.update(Buffer.from(user.keySecret, 'base64')),
      decipherKeySecret.final(),
    ]);
    // Encrypt file properties
    const keySecretFile = decryptedKeySecret.toString();
    const key = (await promisify(scrypt)(
      keySecretFile,
      coffeSalt,
      32,
    )) as Buffer;

    const phoneNumberr = await encryptData(
      Buffer.from(phoneNumber),
      iv,
      key,
    ).toString();
    const genderr = await encryptData(Buffer.from(gender), iv, key).toString();
    const dateOfBirthh = await encryptData(
      Buffer.from(dateOfBirth),
      iv,
      key,
    ).toString();
    const filess = await encryptData(
      Buffer.from(user.files),
      iv,
      key,
    ).toString();

    user.files = filess;
    user.phoneNumber = phoneNumberr;
    user.gender = genderr;
    user.dateOfBirth = dateOfBirthh;
    await user.save();

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
      await this.userModel.create({
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        picture: req.user.picture,
        isAdmin: false,
        isPublished: true,
      });
    } catch (error) {
      console.log('User is the unique!!!');
      const token = req.user.accessToken;
      return { token };
    }

    const token = req.user.accessToken;
    return { token };
  }
}
