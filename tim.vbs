' ============================================================
'  Запуск TIM без единого окна консоли.
'
'  Ярлык на рабочем столе указывает сюда (через wscript.exe), а не на
'  start-tim.bat: любой .bat открывает чёрное окно терминала, и программа
'  перестаёт быть похожей на программу. Здесь всё то же самое, но серверы
'  поднимаются скрыто (третий параметр Run = 0).
'
'  start-tim.bat оставлен рядом намеренно — он показывает окна и ошибки,
'  и нужен, когда что-то не запускается и надо понять почему.
'
'  Открывается /tg/auth, а не лендинг: приложение начинается со входа.
'  Кто уже вошёл, того AuthGuard сам уводит дальше, на /stores.
' ============================================================

Option Explicit

Dim sh, fso, base, backend, url, i, ready, chrome, candidates, p

Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

base = fso.GetParentFolderName(WScript.ScriptFullName)
backend = fso.BuildPath(fso.GetParentFolderName(base), "ideya project  backend")
url = "http://localhost:3000/tg/auth"

' ── Бэкенд ─────────────────────────────────────────────────
If Not IsUp("http://localhost:5000/health") Then
  If fso.FileExists(fso.BuildPath(backend, "package.json")) Then
    sh.Run "cmd /c cd /d """ & backend & """ && npm run dev", 0, False
  End If
End If

' ── Фронтенд ───────────────────────────────────────────────
If Not IsUp("http://localhost:3000") Then
  sh.Run "cmd /c cd /d """ & base & """ && npm run dev", 0, False
End If

' ── Ждём, пока фронтенд ответит (до 90 секунд) ─────────────
ready = False
For i = 1 To 45
  If IsUp("http://localhost:3000") Then
    ready = True
    Exit For
  End If
  WScript.Sleep 2000
Next

If Not ready Then
  MsgBox "TIM дар 90 сония ҷавоб надод." & vbCrLf & vbCrLf & _
         "Файли start-tim.bat-ро кушоед — он хаторо нишон медиҳад.", _
         vbExclamation, "TIM"
  WScript.Quit 1
End If

' ── Окно приложения ────────────────────────────────────────
' --app даёт окно без адресной строки, вкладок и кнопок.
chrome = ""
candidates = Array( _
  sh.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe"), _
  sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"), _
  sh.ExpandEnvironmentStrings("%LocalAppData%\Google\Chrome\Application\chrome.exe"))

For Each p In candidates
  If chrome = "" Then
    If fso.FileExists(p) Then chrome = p
  End If
Next

If chrome <> "" Then
  sh.Run """" & chrome & """ --app=" & url, 1, False
Else
  sh.Run url, 1, False
End If

' ── Проверка, отвечает ли адрес ────────────────────────────
Function IsUp(addr)
  Dim h
  On Error Resume Next
  Set h = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  h.SetTimeouts 2000, 2000, 2000, 3000
  h.Open "GET", addr, False
  h.Send
  IsUp = (Err.Number = 0)
  On Error GoTo 0
End Function
