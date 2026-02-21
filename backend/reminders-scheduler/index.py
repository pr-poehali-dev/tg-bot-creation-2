import json
import os
import psycopg2
import urllib.request
from datetime import datetime, timedelta

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p37647051_tg_bot_creation_2')
BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')

def send_telegram(chat_id: int, text: str):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = json.dumps({'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}).encode()
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(req, timeout=10)

def next_remind_at(remind_at: datetime, repeat: str) -> datetime:
    if repeat == 'daily':
        return remind_at + timedelta(days=1)
    if repeat == 'weekly':
        return remind_at + timedelta(weeks=1)
    if repeat == 'monthly':
        month = remind_at.month % 12 + 1
        year = remind_at.year + (remind_at.month // 12)
        return remind_at.replace(year=year, month=month)
    return remind_at

def handler(event: dict, context) -> dict:
    """Планировщик напоминаний: ищет просроченные напоминания и отправляет их в Telegram.
    Вызывается по расписанию (scheduler) или вручную через GET-запрос."""
    cors = {'Access-Control-Allow-Origin': '*'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if not BOT_TOKEN:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'TELEGRAM_BOT_TOKEN not set'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    now = datetime.utcnow()
    cur.execute(
        f"""
        SELECT id, chat_id, text, remind_at, repeat
        FROM {SCHEMA}.reminders
        WHERE sent = FALSE AND done = FALSE AND remind_at <= %s
        ORDER BY remind_at ASC
        LIMIT 50
        """,
        (now,)
    )
    rows = cur.fetchall()
    sent_count = 0

    for row in rows:
        rid, chat_id, text, remind_at, repeat = row
        try:
            send_telegram(chat_id, f"🔔 <b>Напоминание</b>\n\n{text}")
            if repeat == 'once':
                cur.execute(f"UPDATE {SCHEMA}.reminders SET sent = TRUE WHERE id = %s", (rid,))
            else:
                new_remind = next_remind_at(remind_at, repeat)
                cur.execute(
                    f"UPDATE {SCHEMA}.reminders SET sent = FALSE, remind_at = %s WHERE id = %s",
                    (new_remind, rid)
                )
            sent_count += 1
        except Exception as e:
            print(f"Failed to send reminder {rid}: {e}")

    conn.commit()
    conn.close()

    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({'sent': sent_count, 'checked_at': now.isoformat()})
    }
