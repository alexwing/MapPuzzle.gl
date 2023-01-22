import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "../../i18n/config";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <Modal show={show} onHide={handleCancel}>
          <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{message}</Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleOK}>
              {t("ConfirmDialog.yes")}
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
            {t("ConfirmDialog.no")}
            </Button>
          </Modal.Footer>
        </Modal>
    </React.Fragment>
  );
}
export default ConfirmDialog;
