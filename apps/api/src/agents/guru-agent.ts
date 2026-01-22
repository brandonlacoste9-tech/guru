import { spawn } from 'child_process';
import path from 'path';

export interface GuruAgentConfig {
  task: string;
  provider?: 'google' | 'anthropic';
  model?: string;
}

export class GuruAgentWrapper {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'python/agent_runner.py');
  }

  async runTask(config: GuruAgentConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        this.pythonScriptPath,
        '--task', config.task,
        '--provider', config.provider || 'google',
      ];

      if (config.model) {
        args.push('--model', config.model);
      }

      const pythonProcess = spawn('python', args);

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Agent failed with exit code ${code}: ${error}`));
        }
      });
    });
  }
}
