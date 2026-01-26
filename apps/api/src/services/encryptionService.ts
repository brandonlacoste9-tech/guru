import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Require encryption key from environment - no defaults for security
const KEY_HEX = process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_SECRET;
if (!KEY_HEX) {
  throw new Error('ENCRYPTION_KEY or ENCRYPTION_SECRET environment variable is required for secure encryption');
}

const KEY = Buffer.from(KEY_HEX, 'hex');

export class EncryptionService {
  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  static encrypt(plaintext: string): { 
    encrypted: string; 
    iv: string; 
    authTag: string;
  } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt data (only happens in Python sidecar memory)
   */
  static decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      KEY,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
