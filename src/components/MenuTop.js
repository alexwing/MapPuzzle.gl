import React, { Component } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';



export default class MenuTop extends Component {

    render() {
      const { onSelectMap } = this.props;

      return <Navbar bg="light" expand="lg">
      <Navbar.Brand href="#home"><img src="./logo192.png" alt=""/>{this.props.name}
        </Navbar.Brand> 
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <NavDropdown title="Select Puzzle" id="basic-nav-dropdown">
        <NavDropdown.Item id="World Countries" href="#World Countries" onClick={onSelectMap} >World Countries</NavDropdown.Item>
      </NavDropdown>          
        </Nav>
         
      </Navbar.Collapse>
    </Navbar>;
    }

}