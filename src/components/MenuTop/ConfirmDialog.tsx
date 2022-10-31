import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";


interface ConfirmDialogProps {
  title: string;
  message: string;
  show: boolean;
  handleCancel: () => void;
  handleOK: () => void;
}

function ConfirmDialog({ 
    title,
    message,
    show,
    handleCancel,
    handleOK,
 }: ConfirmDialogProps) : JSX.Element {
  return (
    <React.Fragment>
      <Modal show={show} onHide={handleCancel}>
          <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{message}</Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleOK}>
              Yes
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
    </React.Fragment>
  );
}
export default ConfirmDialog;
