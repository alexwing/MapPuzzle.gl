import React, { Component } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { Link } from 'react-router-dom'
import Info from './Info.js';


export default class MenuTop extends Component {
  constructor(props) {
    super(props)
    this.state = {
      show: false,
      showInfo: false,
    }
  }
  render() {

    const { onSelectMap, onResetGame, onFullScreen } = this.props;
    let handleClose = () => {
      this.setState({
        show: false,
        showInfo: false
      });
    }
    let handleOK = () => {
      onResetGame();
      this.setState({
        show: false,
        showInfo: false
      });
    }

    let handleShow = () => {
      this.setState({
        show: true,
        showInfo: false
      });
    }


    let handleInfo = () => {
      this.setState({
        show: false,
        showInfo: true
      });
    }

    let InfoCloseHandle = () => {
      this.setState({
        show: false,
        showInfo: false
      });
    }
    


    const Puzzles = (
      <Nav className="mr-auto">
        <NavDropdown title="Select a Puzzle" id="puzzle">
          {this.props.content.map(c =>
          (
              <NavDropdown.Item as={Link} id={c.id} key={c.id} to={"./?map=" + c.url} onClick={onSelectMap} exact>
                <img src={c.icon} alt={c.name} />
                {c.name}
              </NavDropdown.Item>
          ))}
        </NavDropdown>
      </Nav>
    );

    return <div>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand ><img src="./logo192.png" alt="" />{this.props.name}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {Puzzles}
          <Form inline>
            <Button id="fullscreen" variant="outline-secondary" onClick={onFullScreen}><span className="navbar-full-icon"></span></Button>
            <Button id="info" variant="outline-secondary" onClick={handleInfo}><span className="navbar-info-icon"></span></Button>
            <Button id="reset" variant="outline-primary" onClick={handleShow}>Reset Game</Button>
          </Form>
        </Navbar.Collapse>
      </Navbar>
      <Info show={this.state.showInfo} content={this.props.content} InfoClose={InfoCloseHandle}/>
      <Modal show={this.state.show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Do you surrender?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Click yes, if you want to start a new game</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleOK}>
            Yes
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    
    </div>;
  }

}