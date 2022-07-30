import React from "react";
import Table from "react-bootstrap/Table";
import CustomTranslations from "../../backend/src/models/customTranslations";

export default function ErrorList(props: any) {
  const { customTranslations } = props;

  if (customTranslations.length === 0) {
    return null;
  }
  return (
    <div style={{ maxHeight: "40vh", overflowY: "auto", marginTop: "10px" }}>
      <Table striped responsive bordered hover size="sm">
        <thead>
          <tr>
            <th>Map</th>
            <th>Piece</th>
            <th>Lang</th>
            <th>Name piece</th>
          </tr>
        </thead>
        <tbody>
          {customTranslations.map((c: CustomTranslations) => (
            <tr key={c.id}>
              <td width="10%">{c.id}</td>
              <td width="10%">{c.cartodb_id}</td>
              <td width="20%">{c.lang}</td>
              <td width="60%">{c.translation}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}