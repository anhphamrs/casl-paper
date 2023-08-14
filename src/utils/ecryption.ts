import { Cipher, createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from 'src/auth/schemas/user.schemas';

// entcrypt user Object
export async function encryptUserObject(
  oldObject: object,
  fields: Array<keyof User>,
  idUser: any,
  password: string,
): Promise<object> {
  const encryptionPromises = fields.map(async (field) => {
    if (oldObject.hasOwnProperty(field)) {
      const { encryptedElements } = await encryptedElement(
        oldObject[field],
        idUser,
        password,
      );
      oldObject[field] = encryptedElements.toString('base64');
    }
  });

  await Promise.all(encryptionPromises);
  return oldObject;
}

export async function createPCAES(
  password: string,
  idUser: any,
): Promise<{ passwordAES: string; cipher: Cipher }> {
  const iv = randomBytes(16);
  const hashedPassword = await bcrypt.hash(password, 10);
  const coffeSalt = randomBytes(4);
  const passwordAES = hashedPassword + coffeSalt + iv + idUser;
  const key = (await promisify(scrypt)(passwordAES, coffeSalt, 32)) as Buffer;
  const cipher = createCipheriv('aes-256-ctr', key, iv);
  return { passwordAES, cipher };
}

async function encryptedElement(
  field: any,
  idUser: any,
  password: string,
): Promise<{ encryptedElements: Buffer; passwordAES: string }> {
  const { passwordAES, cipher } = await createPCAES(password, idUser);
  const encryptedElements = Buffer.concat([
    cipher.update(field.toString()),
    cipher.final(),
  ]);

  return { encryptedElements, passwordAES };
}

// Encrypt File Object

// Function to encrypt data
export function encryptData(
  data: Buffer,
  iv: Buffer,
  ENCRYPTION_KEY: Buffer,
): string {
  try {
    const cipher = crypto.createCipheriv('aes-256-ctr', ENCRYPTION_KEY, iv);

    let encryptedData = cipher.update(data);
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);

    return encryptedData.toString('base64');
  } catch (error) {
    throw new Error('Encryption failed');
  }
}
