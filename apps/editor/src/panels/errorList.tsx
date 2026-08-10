import React from "react";
import Table from "react-bootstrap/Table";
import type { CustomTranslations } from "@mappuzzle/shared";

interface ErrorListProps {
  customTranslations: CustomTranslations[];
}

/**
 * The pieces a content job could not resolve.
 *
 * The rows arrive as CustomTranslations because that is what the jobs collect,
 * but what matters here is the piece: its number, and the name that was looked
 * up and found nothing. Wikipedia usually has the article under a fuller title,
 * so these are the ones to fix by hand in the Pieces tab.
 */
export default function ErrorList({
  customTranslations,
}: ErrorListProps): JSX.Element | null {
  if (!customTranslations || customTranslations.length === 0) {
    return null;
  }
  return (
    <React.Fragment>
      <h6 className="mt-4">
        {customTranslations.length} piece
        {customTranslations.length === 1 ? "" : "s"} to look at
      </h6>
      <p className="text-muted small mb-2">
        Nothing was found for these. Open the Pieces tab and set the article
        title by hand: Wikipedia often files them under a longer name, such as
        &quot;Al-Qassim Province&quot; for &quot;Al Qassim&quot;.
      </p>
      <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
        <Table striped responsive bordered hover size="sm">
          <thead>
            <tr>
              <th>Piece</th>
              <th>Name looked up</th>
              <th>Language</th>
            </tr>
          </thead>
          <tbody>
            {customTranslations.map((c: CustomTranslations, index: number) => (
              // Composite key: every row of a run carries the same puzzle id, so
              // keying on it alone gave React duplicates.
              <tr key={`${c.id}-${c.cartodb_id}-${c.lang}-${index}`}>
                <td width="15%">{c.cartodb_id}</td>
                <td width="65%">{c.translation}</td>
                <td width="20%">{c.lang}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </React.Fragment>
  );
}
