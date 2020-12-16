import React, { Component } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { Link } from 'react-router-dom'


export default class MenuTop extends Component {
  constructor(props) {
    super(props)
    this.state = {
      show: false,
    }
  }
  render() {

    const { onSelectMap, onResetGame } = this.props;
    let handleClose = () => {
      this.setState({
        show: false
      });
    }
    let handleOK = () => {
      onResetGame();
      this.setState({
        show: false
      });
    }

    let handleShow = () => {
      this.setState({
        show: true
      });
    }

    const Puzzles = (
      <Nav className="mr-auto">
        <NavDropdown title="Select a Puzzle" id="puzzle">
          {this.props.content.map(c =>
          (
            <Link className="dropdown-item" id={c.id} key={c.id} to={"./?map=" + c.url} onClick={onSelectMap}>
              <img src={c.icon} alt={c.name} />
              {c.name}
            </Link>
          ))}
        </NavDropdown>
      </Nav>
    );

    return <div>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#home"><img src="./logo192.png" alt="" />{this.props.name}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {Puzzles}
          <Form inline>
            <Button variant="outline-primary" onClick={handleShow}>Reset Game</Button>
          </Form>
        </Navbar.Collapse>
      </Navbar>
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