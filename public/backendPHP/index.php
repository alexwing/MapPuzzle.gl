<?php

//disable coors
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');
//ignore security
header('Access-Control-Allow-Credentials: true');
//remove gzip

// get the HTTP method, path and body of the request
$method = $_SERVER['REQUEST_METHOD'];


header('Content-Type: application/json');

// Decode raw body typ aplication/json
$body = json_decode(file_get_contents('php://input'), true);

// connect to the sqlite database
try {
  $pdo = new PDO('sqlite:' . dirname(__FILE__) . '/../front.sqlite3.png');
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
  //SQLITE OPEN IN READONLY
  $pdo->setAttribute(PDO::SQLITE_OPEN_READONLY, true);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // WARNING | EXCEPTION | SILENT
  $pdo->query("CREATE TABLE IF NOT EXISTS users ( 
    id           INTEGER         PRIMARY KEY AUTOINCREMENT,
    mail         VARCHAR( 250 ),
    age          INTEGER
  );");
} catch (Exception $e) {
  echo json_encode(['error' => 'Don\'t access to SQLite database : ' . $e->getMessage()]);
  die();
}
$sql = null;

if ($method == "POST") {
  if ($body) {
    //get query value from body
    $sql = $body['query'];
    //security sql injection
    $sql = str_replace(";", "", $sql);
    //detect DELETE INSERT UPDATE CREATE DROP
    if (preg_match("/(DELETE|INSERT|UPDATE|CREATE|DROP)/i", $sql)) {
      echo json_encode(["error" => "SQL injection detected"]);
    }
  }
}else{
  echo json_encode(["error" => "Method not allowed"]);
  die();
}

if ($sql == null) {
  //return empty array
  echo json_encode(["error" => "SQL query is empty"]);
  die();
}

// excecute SQL statement
$stmt = $pdo->prepare($sql);
$stmt->execute();
$result = $stmt->fetchAll();

// print results in JSON format
if (!$result) {
  echo json_encode([]);
  die();
} else {

  echo json_encode($result,JSON_NUMERIC_CHECK);
  die();
}
