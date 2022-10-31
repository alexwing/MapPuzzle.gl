import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import "./LoadingDialog.css";
import { Spinner } from "react-bootstrap";

interface LoadingDialogProps {
  show: boolean;
  delay: number;
}

function LoadingDialog({ show = false, delay = 0 }: LoadingDialogProps) : JSX.Element {
  const [showIn, setShowIn] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowIn(show);
    }, delay);

    return () => clearTimeout(timeout);
  }, [show, delay]);

  return (
    <React.Fragment>
      <Modal
        className="progress-dialog"
        show={showIn}
        centered
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            Loading...
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col lg={12}>
              <Spinner animation="border" variant="info" />
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
}
export default LoadingDialog;
