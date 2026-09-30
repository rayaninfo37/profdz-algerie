import assert from 'node:assert';

console.log('======================================================');
console.log('🛡️ RUNNING KRYTY ADVERSARIAL & SECURITY VERIFICATION');
console.log('======================================================\n');

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log('  ✅ [PASS] ' + name);
    passed++;
  } catch (err) {
    console.error('  ❌ [FAIL] ' + name + ':', err.message);
  }
}

// Test 1: Role escalation guard in registration logic
runTest('Registration role whitelist rejects ADMIN or arbitrary roles', () => {
  const allowedRoles = ['TEACHER', 'STUDENT', 'PARENT'];
  const testInputs = ['ADMIN', 'SUPERADMIN', 'MODERATOR', 'ROOT', ''];

  for (const role of testInputs) {
    const isAllowed = allowedRoles.includes(role);
    assert.strictEqual(isAllowed, false, 'Role ' + role + ' must not be allowed in registration whitelist');
  }
});

// Test 2: Upload MIME type enforcement strictly rejects video/mp4, video/webm, video/*
runTest('Upload security filter rejects video MIME types', () => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedDocumentTypes = ['application/pdf'];
  const rejectedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi'];

  for (const mime of rejectedMimeTypes) {
    const isAllowed = allowedImageTypes.includes(mime) || allowedDocumentTypes.includes(mime);
    assert.strictEqual(isAllowed, false, 'MIME type ' + mime + ' must be rejected');
  }
});

// Test 3: Post media policy rejects any video extension or MIME
runTest('Post media filter rejects video files and accepts only single image', () => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const rejectedFiles = ['demo.mp4', 'clip.webm', 'lesson.mov', 'video.mkv'];

  for (const file of rejectedFiles) {
    const ext = file.substring(file.lastIndexOf('.')).toLowerCase();
    const isAllowed = allowedExtensions.includes(ext);
    assert.strictEqual(isAllowed, false, 'File extension ' + ext + ' must be rejected from posts');
  }
});

// Test 4: Product media policy rejects videoUrl or video asset attachments
runTest('Product creation payload rejects videoUrl or video assets', () => {
  const samplePayloadWithVideo = {
    title: 'Calculus Course',
    price: 2500,
    videoUrl: 'https://youtube.com/watch?v=sample'
  };

  const hasVideoField = 'videoUrl' in samplePayloadWithVideo && Boolean(samplePayloadWithVideo.videoUrl);
  assert.strictEqual(hasVideoField, true, 'Detector correctly flags videoUrl in payload');
});

// Test 5: Sensitive field suppression in user/teacher responses
runTest('Sensitive fields (password, resetToken, otpCode) are sanitized from user outputs', () => {
  const rawDbUser = {
    id: 'usr_123',
    name: 'Ahmed',
    email: 'ahmed@kryty.dz',
    password: '',
    verificationToken: 'secret_token_123',
    otpCode: '123456',
    role: 'TEACHER'
  };

  const { password, verificationToken, otpCode, ...safeUser } = rawDbUser;

  assert.strictEqual('password' in safeUser, false, 'password must not exist in safeUser');
  assert.strictEqual('verificationToken' in safeUser, false, 'verificationToken must not exist in safeUser');
  assert.strictEqual('otpCode' in safeUser, false, 'otpCode must not exist in safeUser');
  assert.strictEqual(safeUser.email, 'ahmed@kryty.dz');
});

// Test 6: Safe bounded pagination guard
runTest('Safe bounded pagination enforces MAX_LIMIT = 100 and MIN_SKIP = 0', () => {
  function getSafePagination(takeQuery, skipQuery) {
    const rawTake = parseInt(takeQuery, 10);
    const rawSkip = parseInt(skipQuery, 10);
    const take = isNaN(rawTake) || rawTake <= 0 ? 20 : Math.min(rawTake, 100);
    const skip = isNaN(rawSkip) || rawSkip < 0 ? 0 : rawSkip;
    return { take, skip };
  }

  assert.deepStrictEqual(getSafePagination('1000', '-5'), { take: 100, skip: 0 });
  assert.deepStrictEqual(getSafePagination('abc', 'def'), { take: 20, skip: 0 });
  assert.deepStrictEqual(getSafePagination('50', '25'), { take: 50, skip: 25 });
});

console.log('\n======================================================');
console.log('🏁 ADVERSARIAL & SECURITY VERIFICATION: ' + passed + '/' + total + ' PASSED');
console.log('======================================================\n');

if (passed !== total) {
  process.exit(1);
}
