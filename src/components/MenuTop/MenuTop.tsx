import React, { Component } from "react";
import Navbar from "react-bootstrap/Navbar";
import Info from "../Info";
import PuzzleSelector from "./PuzzleSelector";
import PuzzleOptions from "./PuzzleOptions";
import ConfirmDialog from "./ConfirmDialog";

export default class MenuTop extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      show: false,
      showInfo: false,
    };
  }
  render() {
    const {
      onSelectMap,
      onResetGame,
      onFullScreen,
      onRefocus,
      onShowWikiInfo,
      onShowEditor,
    } = this.props;
    const handleCancel = () => {
      this.setState({
        show: false,
        showInfo: false,
        showWikiInfo: false,
        showEditor: false,
      });
    };
    const handleOK = () => {
      onResetGame();
      this.setState({
        show: false,
        showInfo: false,
        showWikiInfo: false,
        showEditor: false,
      });
    };

    const handleShow = () => {
      this.setState({
        show: true,
        showInfo: false,
        showWikiInfo: false,
        showEditor: false,
      });
    };

    const handleInfo = () => {
      this.setState({
        show: false,
        showInfo: true,
        showWikiInfo: false,
      });
    };
    return (
      <React.Fragment>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand>
            <img src="./logo192.png" alt="" />
            {this.props.name}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <PuzzleSelector
              puzzles={this.props.content}
              onSelectMap={onSelectMap}
            />
            <PuzzleOptions
              onRefocus={onRefocus}
              onFullScreen={onFullScreen}
              handleInfo={handleInfo}
              onShowWikiInfo={onShowWikiInfo}
              onShowEditor={onShowEditor}
              handleShow={handleShow}
            />
          </Navbar.Collapse>
        </Navbar>
        <Info
          show={this.state.showInfo}
          content={this.props.content}
          InfoClose={handleCancel}
        />
        <ConfirmDialog
          show={this.state.show}
          handleCancel={handleCancel}
          handleOK={handleOK}
          title="Do you surrender?"
          message="Click yes, if you want to start a new game"
        />
      </React.Fragment>
    );
  }
}
