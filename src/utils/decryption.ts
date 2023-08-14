import * as crypto from 'crypto';

// Function to decrypt data
export function decryptData(
  encryptedData: string,
  iv: Buffer,
  ENCRYPTION_KEY: Buffer,
): string {
  try {
    const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-ctr', ENCRYPTION_KEY, iv);

    let decryptedData = decipher.update(encryptedDataBuffer);
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);

    return decryptedData.toString('utf8');
  } catch (error) {
    throw new Error('Decryption failed');
  }
}
