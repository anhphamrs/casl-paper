import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File } from './schemas/file.schema';
import { DeleteDto } from './dto/delete.dto';
import { DeleteManyDto } from './dto/deletemany.dto';
import { encryptData } from 'src/utils/ecryption';
import { decryptData } from 'src/utils/decryption';
import { promisify } from 'util';
import { createDecipheriv, scrypt } from 'crypto';
import { User } from 'src/auth/schemas/user.schemas';

@Injectable()
export class FileService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<File>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async uploadFileEncrypt(
    file: Express.Multer.File,
    fileUserId: string,
  ): Promise<{ notiFication: string }> {
    try {
      if (!file) {
        throw new Error('File is missing');
      }
      const user = await this.userModel.findById(fileUserId);
      // Get information for decryption
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
      const decipherKeySecret = createDecipheriv(
        'aes-256-ctr',
        keySecretDec,
        iv,
      );
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
      // Implement the 'encryptData' function to encrypt the file data
      const originalName = await encryptData(
        Buffer.from(file.originalname),
        iv,
        key,
      ).toString();
      const mimeType = await encryptData(
        Buffer.from(file.mimetype),
        iv,
        key,
      ).toString();
      const fileSize = await encryptData(
        Buffer.from(file.size.toString()),
        iv,
        key,
      ).toString();
      const fileBuffer = await encryptData(
        Buffer.from(file.buffer.toString('base64')),
        iv,
        key,
      ).toString();
      let filess = await encryptData(
        Buffer.from(user.files),
        iv,
        key,
      ).toString();
      const newFile = await this.fileModel.create({
        fileUserId,
        originalName,
        mimeType,
        fileSize,
        fileBuffer,
      });

      // Save the document
      await newFile.save();

      // Thêm ID của file mới vào chuỗi user.files, cách nhau bởi dấu phẩy (,)
      filess = filess
        ? filess + ',' + newFile._id.toString()
        : newFile._id.toString();
      user.files = await encryptData(Buffer.from(filess), iv, key).toString();

      await user.save();

      return { notiFication: 'Successful' };
    } catch (error) {
      // Handle any potential errors
      console.error('Error during encryption and file saving:', error);
      throw error;
    }
  }

  async uploadFileNoneEncrypt(
    file: Express.Multer.File,
    fileUserId: string,
  ): Promise<{ notiFication: string }> {
    let notiFication;
    // Get file details
    const { originalname, mimetype, size, buffer } = file;

    const user = await this.userModel.findById(fileUserId);
    if (!user) {
      notiFication = "User doesn't exist";
    } else {
      // Save the file details to the database
      await this.fileModel.create({
        fileUserId,
        originalName: originalname,
        mimeType: mimetype,
        fileSize: size,
        fileBuffer: buffer.toString('base64'), // Save buffer as a Base64 string
      });
      notiFication = 'Successful';
    }

    return { notiFication };
  }

  // READ
  async readFile(fileId: string, fileUserId: string): Promise<object> {
    const file = await this.fileModel.findById(fileId);
    const user = await this.userModel.findById(fileUserId);

    if (!file || file.fileUserId !== fileUserId) {
      throw new NotFoundException('File not found');
    }

    // Convert the file document to the desired JSON object
    const fileObject = {
      fieldname: 'file',
      originalname: file.originalName,
      encoding: '7bit',
      mimetype: file.mimeType,
      fileSize: file.fileSize,
      buffer: Buffer.from(file.fileBuffer, 'base64'), // Convert Base64 string back to Buffer
    };

    return fileObject;
  }

  async readFileEnt(fileId: string, fileUserId: string): Promise<object> {
    const encryptFile = await this.fileModel.findById(fileId);
    const user = await this.userModel.findById(fileUserId);

    if (!encryptFile || encryptFile.fileUserId !== fileUserId) {
      throw new NotFoundException('File not found');
    }

    // Get information for decryption
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

    // Implement the 'decryptData' function to decrypt the file data
    const originalName = decryptData(
      encryptFile.originalName,
      iv,
      key,
    ).toString();
    const mimeType = decryptData(encryptFile.mimeType, iv, key).toString();
    const fileSize = decryptData(encryptFile.fileSize, iv, key).toString();
    const fileBuffer = decryptData(encryptFile.fileBuffer, iv, key).toString();
    const fileObject = {
      fieldname: 'file',
      originalname: originalName,
      encoding: '7bit',
      mimetype: mimeType,
      size: fileSize,
      buffer: Buffer.from(fileBuffer, 'base64'),
    };

    return fileObject;
  }

  // UPDATE (Not implemented in this code snippet)

  // DELETE

  async deleteFile(deleteDto: DeleteDto): Promise<{ notiFication: string }> {
    const { fileUserId, fileId } = deleteDto;
    const file = await this.fileModel.findById(fileId);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.fileUserId !== fileUserId) {
      return { notiFication: "User doesn't exist" };
    }

    await this.fileModel.findByIdAndDelete(fileId);
    return { notiFication: 'Successful' };
  }

  async deleteManyFile(
    deleteManyDto: DeleteManyDto,
  ): Promise<{ notiFication: string }> {
    const { fileUserId } = deleteManyDto;

    // Delete all files with the specified fileUserId
    await this.fileModel.deleteMany({ fileUserId });

    return { notiFication: 'Successfully deleted all files with fileUserId.' };
  }
}
