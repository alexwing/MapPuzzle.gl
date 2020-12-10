import React, { Component } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Accordion from 'react-bootstrap/Accordion';
import Table from 'react-bootstrap/Table';
import Timer from './Timer';
import { setColor } from './Utils';



class ToolsPanel extends Component {


  render() {

    const { height, pieceSelected, pieces, onPieceSelected, founds } = this.props;

    const Legend = (
      <Table striped bordered hover size="sm" className="legend">
        <tbody>
          {pieces.map(c =>
            founds.includes(c.properties.cartodb_id) ? null : (
              <tr key={c.properties.cartodb_id} onClick={onPieceSelected} id={c.properties.cartodb_id} className={parseInt(c.properties.cartodb_id) === parseInt(pieceSelected) ? "table-primary" : ""}>
                <td width="80%">{c.properties.name ? c.properties.name : c.properties.formal_en}</td>
                <td width="20%" align="right" className="legendPiece">
                  <svg viewBox={(c.properties.box)} preserveAspectRatio="slice">
                    <path d={c.properties.poly} stroke="black" strokeWidth="0" fill={setColor(c.properties.mapcolor)} />
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
          {this.props.name}
          <Timer  YouWin={this.props.YouWin}/>
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="0">
          <Card.Body>
            <Form>
              <Row className="score">
                <Col xs={4} lg={4} >
                  <Alert variant="success">
                    <Alert.Heading>Founds:</Alert.Heading>
                    <hr />
                    <p className="mb-0">
                      {founds.length}
                    </p>
                  </Alert>
                </Col>
                <Col xs={4} lg={4}>
                  <Alert variant="warning">
                    <Alert.Heading>Remaining:</Alert.Heading>
                    <hr />
                    <p className="mb-0">
                      {pieces.length - founds.length}
                    </p>
                  </Alert>
                </Col>
                <Col xs={4} lg={4}>
                  <Alert variant="danger">
                    <Alert.Heading>Fails:</Alert.Heading>
                    <hr />
                    <p className="mb-0">
                      {this.props.fails}
                    </p>
                  </Alert>
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