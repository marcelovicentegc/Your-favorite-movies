import * as bcrypt from "bcrypt";
import { IResolvers } from "graphql-tools";
import fetch from "node-fetch";
import { getConnection } from "typeorm";
import { Movies, User } from "../database/entities/index";
import {
  duplicate,
  invalidEmail,
  passwordNotLongEnough,
  usernameNotLongEnough
} from "../utils/errorMessages";
import { validEmail, validPassword, validUsername } from "../utils/errors";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const resolvers: IResolvers = {
  Query: {
    user: async (_, __, { req }) => {
      if (!req.session.userId) {
        return null;
      }
      return User.findOne(req.session.userId, { relations: ["movies"] });
    },
    users: async () => User.find(),
    movies: async (_, args, context) => {
      return await fetch(
        `${TMDB_API_URL}/search/movie?api_key=${context.secret.API_KEY}&query=${
          args.query
        }&include_adult=false`
      )
        .then(res => res.json())
        .then(({ results }) => results);
    },
    movie: async (_, args, context) => {
      return await fetch(
        `${TMDB_API_URL}/movie/${args.id}?api_key=${
          context.secret.API_KEY
        }&append_to_response=credits`
      ).then(res => res.json());
    },
    movie_genres: async (_, __, context) => {
      return await fetch(
        `${TMDB_API_URL}/genre/movie/list?api_key=${context.secret.API_KEY}`
      )
        .then(res => res.json())
        .then(({ genres }) => genres);
    },
    trending_movies: async (_, __, context) => {
      return await fetch(
        `${TMDB_API_URL}/movie/popular/?api_key=${context.secret.API_KEY}`
      ).then(res => res.json());
    },
    config: async (_, __, context) => {
      return fetch(
        `${TMDB_API_URL}/configuration?api_key=${context.secret.API_KEY}`
      ).then(res => res.json());
    }
  },
  Mutation: {
    createUser: async (_, { email, username, password }, { req }) => {
      const emailAlreadyExists = await User.findOne({
        where: { email },
        select: ["id"]
      });
      if (emailAlreadyExists) {
        if (process.env.NODE_ENV === "test") {
          return [
            {
              path: "createUser",
              message: "Email " + duplicate
            }
          ];
        }
        throw new Error("Email " + duplicate);
      }
      const usernameAlreadyExists = await User.findOne({
        where: { username },
        select: ["id"]
      });
      if (usernameAlreadyExists) {
        if (process.env.NODE_ENV === "test") {
          return [
            {
              path: "createUser",
              message: "Username " + duplicate
            }
          ];
        }
        throw new Error("Username " + duplicate);
      }
      if (!validEmail(email)) {
        if (process.env.NODE_ENV === "test") {
          return [
            {
              path: "createUser",
              message: invalidEmail
            }
          ];
        }
        throw new Error(invalidEmail);
      }
      if (!validUsername(username)) {
        if (process.env.NODE_ENV === "test") {
          return [
            {
              path: "createUser",
              message: usernameNotLongEnough
            }
          ];
        }
        throw new Error(usernameNotLongEnough);
      }
      if (!validPassword(password)) {
        if (process.env.NODE_ENV === "test") {
          return [
            {
              path: "createUser",
              message: passwordNotLongEnough
            }
          ];
        }
        throw new Error(passwordNotLongEnough);
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = User.create({
        email: email,
        username: username,
        password: hashedPassword
      });
      await user.save();
      req.session.userId = user.id;
      return null;
    },
    updateUser: async (_, { id, email, username, password }) => {
      const user = await User.findOne(id);
      const emailAlreadyExists = await User.findOne({
        where: { email },
        select: ["id"]
      });
      if (emailAlreadyExists && emailAlreadyExists.id !== user.id) {
        throw new Error("Email " + duplicate);
      }

      const usernameAlreadyExists = await User.findOne({
        where: { username },
        select: ["id"]
      });
      if (usernameAlreadyExists && usernameAlreadyExists.id !== user.id) {
        throw new Error("Username " + duplicate);
      }

      if (email.length !== 0 && !validEmail(email)) {
        throw new Error(invalidEmail);
      }
      if (username.length !== 0 && !validUsername(username)) {
        throw new Error(usernameNotLongEnough);
      }
      if (password.length !== 0 && !validPassword(password)) {
        throw new Error(passwordNotLongEnough);
      }
      try {
        if (password === user.password) {
          await User.update(id, {
            email: email,
            username: username
          });
        } else {
          const hashedPassword = await bcrypt.hash(password, 12);
          await User.update(id, {
            email: email,
            username: username,
            password: hashedPassword
          });
        }
      } catch (error) {
        console.log(error);
        return false;
      }
      return true;
    },
    deleteUser: async (_, { id }) => {
      try {
        await User.remove(id);
      } catch (error) {
        console.log(error);
        return false;
      }
      return true;
    },
    loginUser: async (_, { email, password }, { req }) => {
      const user = await User.findOne({
        where: { email }
      });
      if (!user) {
        throw new Error("This user doesn't exist.");
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new Error("Incorrect password.");
      }

      req.session.userId = user.id;
      return user;
    },
    logoutUser: async (_, __, { req, res }) => {
      console.log(
        "req.session -------------------------------------------------------------------\n",
        req.session
      );
      await new Promise(res => req.session.destroy(() => res()));
      res.clearCookie("connect.sid");
      return true;
    },
    appendMovie: async (_, { movieId, userId }, { req }) => {
      let user = await User.findOne(req.session.userId, {
        relations: ["movies"]
      });
      user.movies.movieId = movieId;
      user.save();
      let movie = new Movies();
      movie.user = userId;
      movie.movieId = movieId;
      await Movies.save(movie);
      return movie;
    },
    dettachMovie: async (_, { movieId }) => {
      try {
        const deleteQuery = getConnection()
          .createQueryBuilder()
          .delete()
          .from(Movies)
          .where("movieId = :movieId", { movieId: movieId });
        await deleteQuery.execute();
      } catch (error) {
        console.log(error);
        return false;
      }
      return true;
    }
  }
};

export default resolvers;
