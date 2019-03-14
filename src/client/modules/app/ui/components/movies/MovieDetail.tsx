import { inject, observer } from "mobx-react";
import * as React from "react";
import { MoviesStore } from "../../../../../stores/Movies.store";
import { GetMovieMovie } from "../../../../../__types__/typeDefs";
import ExtraMovieDetail from "./ExtraMovieDetails";
import FreeMovieDetail from "./FreeMovieDetails";
import ReturnButton from "./movieDetails/ReturnButton";
import Tagline from "./movieDetails/Tagline";

interface Props {
  movie: GetMovieMovie;
  moviesStore?: MoviesStore;
  withALoggedInUser: boolean;
}

@inject("moviesStore")
@observer
export default class MovieDetail extends React.Component<Props> {
  private handleMovieView = () => {
    this.props.moviesStore.handleMovieView();
  };

  render() {
    return (
      <>
        <Tagline tagline={this.props.movie.tagline} />
        <div className="movie-details">
          <FreeMovieDetail movie={this.props.movie} />
          {this.props.withALoggedInUser ? (
            <ExtraMovieDetail movie={this.props.movie} />
          ) : null}
        </div>
        <ReturnButton handleMovieView={this.handleMovieView} />
      </>
    );
  }
}