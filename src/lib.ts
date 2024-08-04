import { exec } from "child_process";

export const runCommand = (command: string, cwd?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const options = {
      cwd,
      buffer: "utf-8",
      shell: "/bin/bash",
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
