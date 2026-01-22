import crypto from 'crypto';

// ============================================
// CREDENTIAL SERVICE
// ============================================
// Handles AES-256-GCM encryption/decryption of user credentials

const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'your-default-32-character-secret-key'; 
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export class CredentialService {
  /**
   * Encrypt a sensitive string
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt an encrypted string
   */
  static decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encryptedData] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Encrypt a JSON object
   */
  static encryptObject(obj: Record<string, any>): string {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Decrypt a JSON object
   */
  static decryptObject<T = Record<string, any>>(encryptedText: string): T {
    return JSON.parse(this.decrypt(encryptedText)) as T;
  }
}
