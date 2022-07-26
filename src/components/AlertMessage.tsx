import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { AlertModel } from "../models/Interfaces";

function AlertMessage({
  show = false,
  alertMessage = {
    title: "",
    message: "",
    type: "danger",
  } as AlertModel,
  onHide,
}: any) {
  const [showIn, setShowIn] = useState(false);
  const [alert, setAlert] = useState(alertMessage);
  //on load show modal
  useEffect(() => {
    setShowIn(show);
    setAlert(alertMessage);
  }, [show, alertMessage]);

  function handleClose() {
    onHide();
  }

  return (
    <Modal
      show={showIn}
      onHide={handleClose}
      size="sm"
      aria-labelledby="contained-modal-title-vcenter"
      centered    
      animation={false}
    >
      <Modal.Header className={"bg-" + alert.type}>
        <Modal.Title
          id="contained-modal-title-vcenter"
          className="modal-title-error"
        >
          {alert.title}
        </Modal.Title>
        <Button variant={alert.type} onClick={handleClose}>
          <i className="close-icon"></i>
        </Button>
      </Modal.Header>
      <Modal.Body className="bg-warning">{alert.message}</Modal.Body>
    </Modal>
  );
}

export default AlertMessage;
