function onEdit(e) {
  const configSpreadsheetUrl = "https://docs.google.com/spreadsheets/d/1hoNQ5ZznnCOg_r8qG1NHEjDl0qSr0-BXZCtqJ5OvXG8/edit#gid=0"; 
  const editedColumn = e.range.getColumn();
  const editedRow = e.range.getRow();

  const sheet = e.range.getSheet();

  if ((editedColumn === 2 || editedColumn === 3) && e.value === "TRUE") {
    Logger.log("s");
    try {
      const userEmail = Session.getActiveUser().getEmail();
      sheet.getRange(editedRow, 4).setValue(userEmail);
    } catch (error) {
      console.error("Error retrieving user information: ", error);
      sheet.getRange(editedRow, 4).setValue("Error");
    }
  }

  if (editedColumn === 3 && e.value === "TRUE") {
    processReservations(configSpreadsheetUrl, editedRow);
  }
  if (editedColumn === 2 && e.value === "FALSE") {
    clearTriggersForRow(editedRow);
  }
  if (editedColumn === 2 && e.value === "TRUE") {
    const frequency = sheet.getRange(editedRow, 5).getValue();
    setScriptProperties(configSpreadsheetUrl, editedRow);
    setRecurrentTrigger(frequency, editedRow, configSpreadsheetUrl);
  }
}

function createTimeDrivenTriggers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();

  data.forEach(function(row, index) {
    if (index === 0) return; // ヘッダー行をスキップ

    if (row[1] === "TRUE") {
      const frequency = row[4];
      const triggerId = `trigger_${index}`;

      // 既存のトリガーを削除
      const triggers = ScriptApp.getProjectTriggers();
      for (const trigger of triggers) {
        if (trigger.getHandlerFunction() === "processReservations" && trigger.getTriggerSourceId() === triggerId) {
          ScriptApp.deleteTrigger(trigger);
          break;
        }
      }

      // 新しいトリガーを作成
      if (frequency === "1分") {
        ScriptApp.newTrigger("processReservations")
          .timeBased()
          .everyMinutes(1)
          .create();
      } else if (frequency === "5分") {
        ScriptApp.newTrigger("processReservations")
          .timeBased()
          .everyMinutes(5)
          .create();
      } else if (frequency === "10分") {
        ScriptApp.newTrigger("processReservations")
          .timeBased()
          .everyMinutes(10)
          .create();
      }
    }
  });
}

/*function onEdit(e) {
  const configSpreadsheetUrl = "https://docs.google.com/spreadsheets/d/1hoNQ5ZznnCOg_r8qG1NHEjDl0qSr0-BXZCtqJ5OvXG8/edit#gid=0"; 
  const editedColumn = e.range.getColumn();
  const editedRow = e.range.getRow();

  const sheet = e.range.getSheet();

  if ((editedColumn === 2 || editedColumn === 3) && e.value === "TRUE") {
    try {
      // 編集者のメールアドレスを取得
      const userEmail = Session.getActiveUser().getEmail();
      // Admin SDKを使用してユーザー情報を取得
      // カラムDにメアドを出力
      sheet.getRange(editedRow, 4).setValue(userEmail);
    } catch (error) {
      console.error("Error retrieving user information: ", error);
      // エラー発生時の処理（オプション）
      sheet.getRange(editedRow, 4).setValue("Error");
    }
  }

  if (editedColumn === 3 && e.value === "TRUE")
    main(configSpreadsheetUrl, editedRow);
  if (editedColumn === 2 && e.value === "FALSE") {
    clearTriggersForRow(editedRow);
  }
  if (editedColumn === 2 && e.value === "TRUE") {
    // カラムOから更新頻度を読み取る
    const frequency = sheet.getRange(editedRow, 15).getValue();
    // main関数の定期実行を設定します
    setScriptProperties(configSpreadsheetUrl, editedRow);
    setRecurrentTrigger(frequency, editedRow, configSpreadsheetUrl);
  }
}

function setScriptProperties(configSpreadsheetUrl, editedRow) {
  PropertiesService.getScriptProperties().setProperty('configSpreadsheetUrl', configSpreadsheetUrl);
  PropertiesService.getScriptProperties().setProperty('editedRow', editedRow.toString());
}

function triggeredMainFunction() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const configSpreadsheetUrl = scriptProperties.getProperty('configSpreadsheetUrl');
  const editedRow = parseInt(scriptProperties.getProperty('editedRow'), 10);

  // ここで main 関数を呼び出す
  main(configSpreadsheetUrl, editedRow);
}

function setRecurrentTrigger(frequency, row, spreadsheetUrl) {
  // Clear existing triggers for the row
  clearTriggersForRow(row);
  
  // 頻度に基づいて新しいトリガーを設定します。
  const timeBased = ScriptApp.newTrigger('triggeredMainFunction').timeBased();
  switch (frequency) {
    case '1分':
      timeBased.everyMinutes(1);
      break;
    case '5分':
      timeBased.everyMinutes(5);
      break;
    case '10分':
      timeBased.everyMinutes(10);
      break;
    case '15分':
      timeBased.everyMinutes(15);
      break;
    case '30分':
      timeBased.everyMinutes(30);
      break;
    case '1時間':
      timeBased.everyHours(1);
      break;
    case '3時間':
      timeBased.everyHours(3);
      break;
    case '6時間':
      timeBased.everyHours(6);
      break;
    case '1日':
      timeBased.atHour(0).everyDays(1); // 毎日0時に実行
      break;
    default:
      console.log('不正な更新頻度が指定されました: ', frequency);
  }
  
  // Create the trigger and store its association
  const trigger = timeBased.create();
  storeTriggerForRow(row, trigger.getUniqueId());
}

// function to clear triggers for a specific row
function clearTriggersForRow(row) {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerId = getTriggerIdForRow(row);
  for (let trigger of triggers) {
    if (trigger.getUniqueId() === triggerId) {
      ScriptApp.deleteTrigger(trigger);
      removeTriggerForRow(row); // Ensure to remove the association from storage
      break;
    }
  }
}

// Store trigger ID associated with a row
function storeTriggerForRow(row, triggerId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  let triggers = scriptProperties.getProperty('triggers');
  triggers = triggers ? JSON.parse(triggers) : {};
  triggers[row] = triggerId;
  scriptProperties.setProperty('triggers', JSON.stringify(triggers));
}

// Retrieve trigger ID for a row
function getTriggerIdForRow(row) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const triggers = JSON.parse(scriptProperties.getProperty('triggers') || '{}');
  return triggers[row];
}

// Remove stored trigger association for a row
function removeTriggerForRow(row) {
  const scriptProperties = PropertiesService.getScriptProperties();
  let triggers = JSON.parse(scriptProperties.getProperty('triggers') || '{}');
  delete triggers[row];
  scriptProperties.setProperty('triggers', JSON.stringify(triggers));
}*/