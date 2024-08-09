import { exec, spawn } from "child_process";

export const runCommandExec = (command: string, cwd?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const options = {
      cwd,
      buffer: "utf-8",
      stdio: "ignore",
      shell: "/usr/bin/bash",
    };

    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(`error: ${error.message}`);
      }
      if (stderr) {
        reject(`stderr: ${stderr}`);
      }
      resolve(stdout);
    });
  });
};

export const runCommandSpawn = (command: string, cwd?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' '); // Split the command into cmd and args
    const options = {
      cwd,
      shell: false, // Do not use a shell with spawn
    };

    const childProcess = spawn(cmd, args, options);

    let stdout = '';
    let stderr = '';

    // Collect data from stdout
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Collect data from stderr
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process close
    childProcess.on('close', (code) => {
      if (code !== 0) {
        reject(`stderr: ${stderr}`);
      } else {
        resolve(stdout);
      }
    });

    // Handle errors
    childProcess.on('error', (error) => {
      reject(`error: ${error.message}`);
    });
  });
};

export const generateId = (length = 8): string => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};
