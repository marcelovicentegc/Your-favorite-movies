import * as React from "react";
import "./main.scss";

interface Props {
  handleMovieView(): void;
}

const ReturnButton: React.FC<Props> = props => {
  return (
    <div className="button-wrapper">
      <button className="return" onClick={props.handleMovieView}>
        <span> ◀ </span>
      </button>
    </div>
  );
};

export default ReturnButton;
