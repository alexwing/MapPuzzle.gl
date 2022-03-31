import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import "./LoadingDialog.css";
import { Spinner } from "react-bootstrap";

function LoadingDialog({  show = false, onHide }: any) {
  const [showIn, setShowIn] = useState(false);

  useEffect(() => {
      setShowIn(show);
  }, [show]);

  return (
    <React.Fragment>
      <Modal
        className="progress-dialog"
        show={showIn}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={onHide}
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            Loading...
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col lg={12}>
              <Spinner animation="border" variant="info"/>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
}
export default LoadingDialog;
