import { inject, observer } from "mobx-react";
import * as React from "react";
import { MoviesStore } from "../../../../../stores/Movies.store";
import "./main.scss";

interface Props {
  moviesStore?: MoviesStore;
}

interface State {
  query: string;
}

@inject("moviesStore")
@observer
export default class SearchBar extends React.Component<Props, State> {
  componentDidMount() {
    this.props.moviesStore.resetQuery();
  }

  state = {
    query: ""
  };

  handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    lastQueryLength: number
  ) => {
    this.props.moviesStore.query = e.target.value;
    const currentQueryLength = e.target.value.length;
    currentQueryLength != lastQueryLength &&
    this.props.moviesStore.movieList === false
      ? (this.props.moviesStore.movieList = true)
      : null;
  };

  render() {
    let lastQueryLength = this.state.query.length;
    return (
      <div className="search-movies">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="e.g. The Lord of the Rings: The Two Towers"
            onChange={e => this.handleChange(e, lastQueryLength)}
          />
        </div>
      </div>
    );
  }
}
