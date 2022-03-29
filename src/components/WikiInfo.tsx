import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import "./WikiInfo.css";

function WikiInfo({
  show = false,
  onHide,
  url = "https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts&format=json&exintro=&titles=Berlin",
}: any) {
  const [contents, setContents] = useState(Array<string>());
  const [loading, setLoading] = useState(false);
  const [showIn, setShowIn] = useState(false);
  const [error, setError] = useState();

  const extractAPIContents = (json: any) => {
    const { pages } = json.query;
    return Object.keys(pages).map((id) => pages[id].extract);
  };

  //on load show modal
  useEffect(() => {
    setShowIn(show);
  }, [show]);

  const getContents = async () => {
    let resp;
    let _contents: Array<string> = [];
    setLoading(true);
    try {
      resp = await fetch(url);
      const json = await resp.json();
      _contents = extractAPIContents(json);
      if (json.query.pages["-1"]) {
        _contents = [            
            "Not found data on Wikipedia"
        ];
      }      
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
    setContents(_contents);
  };

  useEffect(() => {
    if (showIn) {
      getContents();
    }
  }, [url,showIn]);

  function handleClose() {
    onHide();
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;
  return (
    <React.Fragment>
      <Modal
        show={showIn}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            Wikipedia Article
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col lg={12} className="info">
              {contents.map((content) => (
                <div dangerouslySetInnerHTML={{ __html: content }} />
              ))}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose}>Ok</Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
export default WikiInfo;
