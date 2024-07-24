import { exec } from "child_process";
import { buffer } from "stream/consumers";

export const runCommand = (command: string, cwd?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const options = {
      cwd,
      buffer: "utf-8",
      shell: "/bin/bash"
    }

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
