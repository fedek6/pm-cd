import Fastify from "fastify";
import { runCommand } from "./lib";
import "dotenv/config";

const {
  FTP_HOST,
  FTP_USER,
  FTP_PASS,
  LOCAL_DIR,
  REMOTE_DIR,
  PORT,
  UPLOADS_LOCAL_DIR,
  UPLOADS_REMOTE_DIR,
} = process.env;

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

interface PostData {
  project: string;
}

function assertIsPostData(postData: any): asserts postData is PostData {
  if (typeof postData !== "object" || postData === null) {
    throw new Error("Invalid data: not an object");
  }
  if (!("project" in postData)) {
    throw new Error("No post data");
  }
}

fastify.post("/", async (request, reply) => {
  const { authorization } = request.headers;
  const bearer = authorization?.replace("Bearer ", "");

  if (!bearer || bearer !== "aaaa") {
    return reply.status(401).send({ error: "No or invalid Authorization header" });
  }

  try {
    const postData = request.body;
    assertIsPostData(postData);
    if (postData.project !== "msn") {
      return { error: "Invalid project" };
    }
  } catch (err) {
    return reply.status(400).send({ err });
  }

  const worker = async () => {
    console.time("worker");
    const a = await runCommand("yarn build", LOCAL_DIR);
    console.log("Finished build", a);

    const b = await runCommand(`lftp -f <(echo "${lftpCommand1}")`);
    console.log("Finished upload", b);

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
