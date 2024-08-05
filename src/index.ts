import Fastify from "fastify";
import { runCommand, generateId } from "./lib";
import cors from "@fastify/cors";
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
  TOKEN,
  PROJECT,
  NODE_ENV,
  GIT_TOKEN,
} = process.env;

const fastify = Fastify({ logger: NODE_ENV === "development" });

const lftpCommand1 = `
set ftp:ssl-allow no
set ftp:ssl-allow no
set net:timeout 10
set net:max-retries 2
set net:reconnect-interval-base 5
set ftp:passive-mode yes
open ${FTP_HOST}
user ${FTP_USER} ${FTP_PASS}
lcd ${LOCAL_DIR}/out
cd ${REMOTE_DIR}
mirror --reverse --verbose --delete --continue --parallel=2 --no-perms --exclude .htaccess --exclude uploads

lcd ${UPLOADS_LOCAL_DIR}
cd ${UPLOADS_REMOTE_DIR}
mirror --reverse --verbose --delete --continue --parallel=2 --no-perms
bye
`;

const gitCommand = `
git clone https://${GIT_TOKEN}@github.com/fedek6/pm-cd.git
`;

interface PostData {
  project: string;
}

const runningWorkers = new Set<string>();

function assertIsPostData(postData: any): asserts postData is PostData {
  if (typeof postData !== "object" || postData === null) {
    throw new Error("Invalid data: not an object");
  }
  if (!("project" in postData)) {
    throw new Error("No post data");
  }
}

fastify.post("/webhook", async (request, reply) => {
  const { authorization } = request.headers;
  const bearer = authorization?.replace("Bearer ", "");

  if (!bearer) {
    return reply
      .status(401)
      .send({ error: "Missing token" });
  }

  if (bearer !== TOKEN) {
    console.log(`${bearer} !== ${TOKEN}`);
    return reply
      .status(401)
      .send({ error: "Invalid token" });
  }


  try {
    const postData = request.body;
    assertIsPostData(postData);
    if (postData.project !== PROJECT) {
      return { error: "Invalid project" };
    }
  } catch (err) {
    return reply.status(400).send({ err });
  }

  const worker = async () => {
    console.time("worker");
    try {
      const git = await runCommand(`git fetch && git pull`, LOCAL_DIR);
      console.log("Finished git", git);

      const a = await runCommand("yarn build", LOCAL_DIR);
      console.log("Finished build", a);

      const b = await runCommand(`lftp -f <(echo "${lftpCommand1}")`);
      console.log("Finished upload", b);
    } catch (err) {
      console.error(err);
    } finally {
      runningWorkers.delete(PROJECT);
    }

    console.timeEnd("worker");
  };

  if (runningWorkers.has(PROJECT)) {
    return { status: "running" };
  }
  runningWorkers.add(PROJECT);
  worker();

  return { status: "dispatched" };
});

fastify.get("/", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    await fastify.register(cors, {
      origin: "*",
    });
    await fastify.listen({ port: +PORT });
    console.log(`Server is running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
