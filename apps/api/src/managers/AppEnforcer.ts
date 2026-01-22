import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class AppEnforcer {
  /**
   * Auto-install missing dependencies across ecosystems
   */
  async installPackage(
    packageName: string,
    ecosystem: 'winget' | 'npm' | 'pip' | 'apt' = 'winget'
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    
    const commands: Record<string, string> = {
      winget: `winget install ${packageName} --silent --accept-source-agreements --accept-package-agreements`,
      npm: `npm install -g ${packageName}`,
      pip: `pip install ${packageName}`,
      apt: `sudo apt-get install -y ${packageName}`,
    };
    
    const command = commands[ecosystem];
    
    console.log(`🔧 Wiggins: Installing ${packageName} via ${ecosystem}...`);
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000, // 2-minute timeout
      });
      
      console.log(`✅ Wiggins: ${packageName} installed successfully`);
      
      return {
        success: true,
        output: stdout || stderr,
      };
      
    } catch (error: any) {
      console.error(`❌ Wiggins: Failed to install ${packageName}`, error);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify if a package is already installed
   */
  async isInstalled(packageName: string, ecosystem: 'winget' | 'npm' | 'pip' | 'apt'): Promise<boolean> {
    const checkCommands: Record<string, string> = {
      winget: `winget list --name ${packageName}`,
      npm: `npm list -g ${packageName}`,
      pip: `pip show ${packageName}`,
      apt: `dpkg -l | grep ${packageName}`,
    };
    
    try {
      await execAsync(checkCommands[ecosystem]);
      return true;
    } catch {
      return false;
    }
  }
}
