<?php
// ===== INPUT =====
echo "Enter name: ";
$name = trim(fgets(STDIN));

echo "Enter mobile number (optional): ";
$inputNumber = trim(fgets(STDIN));

$numbers = [];

// ===== NUMBER LOGIC =====
if (!empty($inputNumber) && is_numeric($inputNumber)) {
    $len = strlen($inputNumber);

    // 4 digit se full number tak prefixes
    for ($i = 4; $i <= $len; $i++) {
        $numbers[] = substr($inputNumber, 0, $i);
    }

} else {
    // Random 4 digit agar number nahi diya
    $numbers[] = rand(1000, 9999);
}

// ===== NAME VARIATIONS =====
$names = [
    $name,
    strtolower($name),
    strtoupper($name),
    ucfirst(strtolower($name))
];

// ===== SYMBOLS =====
$symbols = ["@", "#", "&", ""];

// ===== FILE OPEN =====
$file = fopen("Pass.txt", "w");

$passwords = [];

// ===== PASSWORD GENERATION =====
foreach ($names as $n) {
    foreach ($numbers as $num) {
        foreach ($symbols as $sym) {
            $passwords[] = $n . $sym . $num;
        }
    }
}

// ===== DUPLICATE REMOVE =====
$passwords = array_unique($passwords);

// ===== SAVE TO FILE =====
foreach ($passwords as $pass) {
    fwrite($file, $pass . PHP_EOL);
}

fclose($file);

// ===== DONE =====
echo "Passwords generated and saved in Pass.txt\n";
?>
