import React, { Component } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Accordion from 'react-bootstrap/Accordion';
import Table from 'react-bootstrap/Table';
import {  ST_ExtentToVieport } from '../components/Utils.js';



class ToolsPanel extends Component {
  
  render() {

    const { height, name, pieceSelected, pieces,onPieceSelected, founds } = this.props;

    const Legend = (
      <Table striped bordered hover size="sm" className="legend">
        <tbody>
          {pieces.map(c => 
          founds.includes(c.cartodb_id) ? null :(
            <tr key={c.cartodb_id} onClick={onPieceSelected} id={c.cartodb_id} className={parseInt(c.cartodb_id) === parseInt(pieceSelected) ? "table-primary" : "" }>
              <td width="80%">{c.name ? c.name :  c.formal_en }</td>
              <td width="20%" align="right">
              <svg className="legendPiece" viewBox={ST_ExtentToVieport(c.box)} preserveAspectRatio="slice">
                <path d={c.poly} stroke="black" strokeWidth="0" fill="gray" />
              </svg>
              </td>	
            </tr>
          ))}
        </tbody>
      </Table>
    
    );

    return <Accordion defaultActiveKey="0">
      <Card>
        <Accordion.Toggle as={Card.Header} eventKey="0" >
          {name}
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="0">
          <Card.Body>
            <Form>
            <Row style={{ padding: "10px"}}>
                <Col xs={12} lg={6} >
                  <Form.Group controlId="formBasicRange" >
                      <Form.Label>Founds: {founds.length}</Form.Label>
                  </Form.Group>
                </Col>
                <Col xs={12} lg={6}>
                  <Form.Group controlId="formBasicRange2">
                    <Form.Label>Remaining: {pieces.length-founds.length}</Form.Label>
                  </Form.Group>
                </Col>
              </Row>              
              <div style={{ overflowY: "auto", maxHeight: (height - 190) + "px" }}>
              {Legend}
              </div>
            </Form>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  }

}

export default ToolsPanel;