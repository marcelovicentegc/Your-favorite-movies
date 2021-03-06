import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { onError } from "apollo-link-error";
import { createUploadLink } from "apollo-upload-client";
import { Provider } from "mobx-react";
import * as React from "react";
import ApolloProvider from "react-apollo/ApolloProvider";
import * as ReactDOM from "react-dom";
import "./main.scss";
import { Routes } from "./routes/index";
import { RootStore } from "./stores";

const rootStore = new RootStore();
declare let module: any;

const client = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors)
        graphQLErrors.map(({ message, locations, path }) =>
          console.log(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        );
      if (networkError) console.log(`[Network error]: ${networkError}`);
    }),
    createUploadLink({
      // On production, set this uri to your DNS.
      uri: `http://127.0.0.1:${
        process.env.TCP !== undefined ? process.env.TCP : "4000"
      }/graphql`,
      credentials: "include"
    })
  ]),
  cache: new InMemoryCache()
});

class App extends React.Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <Provider {...rootStore}>
          <Routes />
        </Provider>
      </ApolloProvider>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));

if (module.hot) {
  module.hot.accept();
}
