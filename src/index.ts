import Fastify from "fastify";
import { runCommand } from "./lib";
import "dotenv/config";

const { FTP_HOST, FTP_USER, FTP_PASS, LOCAL_DIR, REMOTE_DIR, PORT, UPLOADS_LOCAL_DIR, UPLOADS_REMOTE_DIR } =
  process.env;

const fastify = Fastify({ logger: true });

const lftpCommand1 = `
set ftp:ssl-allow no
set ftp:ssl-allow no
set net:timeout 10
set net:max-retries 2
set net:reconnect-interval-base 5
set ftp:passive-mode yes
open ${FTP_HOST}
user ${FTP_USER} ${FTP_PASS}
lcd ${LOCAL_DIR}
cd ${REMOTE_DIR}
mirror --reverse --verbose --delete --continue --parallel=2 --no-perms --exclude .htaccess --exclude uploads

lcd ${UPLOADS_LOCAL_DIR}
cd ${UPLOADS_REMOTE_DIR}
mirror --reverse --verbose --delete --continue --parallel=2 --no-perms
bye
`;

const lftpCommand2 = `
set ftp:ssl-allow no
set ftp:ssl-allow no
set net:timeout 10
set net:max-retries 2
set net:reconnect-interval-base 5
set ftp:passive-mode yes
open ${FTP_HOST}
user ${FTP_USER} ${FTP_PASS}

lcd ${UPLOADS_LOCAL_DIR}
cd ${UPLOADS_REMOTE_DIR}
mirror --reverse --verbose --delete --continue --parallel=2 --no-perms
bye
`;



fastify.get("/", async (request, reply) => {
  const worker = async () => {
    console.time("worker");
    const a = await runCommand("yarn build", LOCAL_DIR);
    console.log("Finished build", a);

    const b = await runCommand(`lftp -f <(echo "${lftpCommand1}")`);
    console.log("Finished upload", b);

    // const c = await runCommand(`lftp -f <(echo "${lftpCommand2}")`);
    // console.log("Finished upload", c);

    console.timeEnd("worker");
  };

  worker();

  return { status: "dispatched" };
});

fastify.get("/webhook", async (request, _) => {
  const authHeader = request.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7, authHeader.length);
    fastify.log.info(`Bearer token: ${token}`);
    return { token };
  } else {
    return { error: "No or invalid Authorization header" };
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: +PORT });
    console.log("Server is running on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
