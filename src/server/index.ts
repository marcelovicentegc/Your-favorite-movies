import { ApolloEngine } from "apollo-engine";
import { ApolloServer } from "apollo-server-express";
import * as bcrypt from "bcrypt";
import * as bodyParser from "body-parser";
import * as connectRedis from "connect-redis";
import * as cors from "cors";
import * as express from "express";
import * as session from "express-session";
import * as path from "path";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { User } from "./database/entities";
import { redis } from "./redis";
import schema from "./schema/schema";

export const startServer = async () => {
  let retries = 5;
  while (retries) {
    try {
      await createConnection().then(connection => {
        console.log("Connected to remote empty database");
      });

      const hashedPassword = await bcrypt.hash("user", 12);
      const user = User.create({
        email: "user@example.com",
        username: "Pierre",
        password: hashedPassword
      });
      await user.save();
      console.log("Default user created");

      break;
    } catch (err) {
      console.log(err);
      retries -= 1;
      console.log(`${retries} retries left`);
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  const server = new ApolloServer({
    schema,
    playground: {
      endpoint: "/api/playground"
    },
    tracing: true,
    cacheControl: true,
    context: ({ req, res }: any) => ({
      req,
      res,
      secret: {
        API_KEY: process.env.TMDB_API_KEY
      }
    }),
    engine: false
  });

  const app = express();

  const RedisStore = connectRedis(session);

  app.use(
    session({
      store: new RedisStore({
        client: redis as any
      }),
      secret: "9314i192481290",
      resave: false,
      saveUninitialized: false
    })
  );
  app.use(bodyParser.json());
  server.applyMiddleware({
    app,
    path: "/api/playground",
    cors: {
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true
    }
  });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve("./dist")));
    app.get("*", cors(), (req, res) => {
      res.sendFile(path.resolve("./dist/index.html"));
    });
  }

  if (process.env.NODE_ENV === "withEngine") {
    const engine = new ApolloEngine({
      apiKey: process.env.ENGINE_API_KEY
    });

    engine.listen(
      {
        port: 8080,
        graphqlPaths: ["/api/playground"],
        expressApp: app,
        launcherOptions: {
          startupTimeout: 3000
        }
      },
      () => {
        console.log("Engine is ready for requests on port 8080");
      }
    );
  }

  app.listen(8080, () => {
    console.log("Server is ready for requests on port 8080");
  });
};

startServer();
