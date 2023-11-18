import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "../../i18n/config";
import { useTranslation } from "react-i18next";
import "./ConfirmDialog.css";
import * as Icon from "react-bootstrap-icons";

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
      <Modal show={show} onHide={handleCancel} centered className="confirmDialog">
          <Modal.Header>
            <Modal.Title>
              <Icon.InfoSquare size={32} className="me-4" />
              {title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{message}</Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleOK} size="lg">
              <Icon.Check size={32} className="me-2" />
              {t("ConfirmDialog.yes")}
            </Button>
            <Button variant="secondary" onClick={handleCancel} size="lg">
              <Icon.X size={32} className="me-2" />
            {t("ConfirmDialog.no")}
            </Button>
          </Modal.Footer>
        </Modal>
    </React.Fragment>
  );
}
export default ConfirmDialog;
