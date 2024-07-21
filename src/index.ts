import { exec } from 'child_process';
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });


const runCommand = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
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

fastify.get('/', async (request, reply) => {
  const a = await runCommand('pwd');
  return { hello: a };
});

fastify.get('/webhook', async (request, reply) => {
  const authHeader = request.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length);
    fastify.log.info(`Bearer token: ${token}`);
    return { token };
  } else {
    return { error: 'No or invalid Authorization header' };
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
