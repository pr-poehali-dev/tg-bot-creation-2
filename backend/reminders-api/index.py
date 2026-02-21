import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p37647051_tg_bot_creation_2')

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """CRUD API для напоминаний: GET список, POST создание, PUT отметить выполненным, DELETE удаление."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    chat_id = params.get('chat_id')

    if not chat_id:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'chat_id required'})}

    conn = get_conn()
    cur = conn.cursor()

    if method == 'GET':
        cur.execute(
            f"SELECT id, text, remind_at, repeat, done, sent FROM {SCHEMA}.reminders WHERE chat_id = %s ORDER BY remind_at ASC",
            (int(chat_id),)
        )
        rows = cur.fetchall()
        data = [
            {'id': r[0], 'text': r[1], 'remind_at': r[2].isoformat(), 'repeat': r[3], 'done': r[4], 'sent': r[5]}
            for r in rows
        ]
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps(data)}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        text = body.get('text', '').strip()
        remind_at = body.get('remind_at')
        repeat = body.get('repeat', 'once')
        if not text or not remind_at:
            conn.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'text and remind_at required'})}
        cur.execute(
            f"INSERT INTO {SCHEMA}.reminders (chat_id, text, remind_at, repeat) VALUES (%s, %s, %s, %s) RETURNING id",
            (int(chat_id), text, remind_at, repeat)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': new_id})}

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        reminder_id = body.get('id')
        done = body.get('done', True)
        cur.execute(
            f"UPDATE {SCHEMA}.reminders SET done = %s WHERE id = %s AND chat_id = %s",
            (done, int(reminder_id), int(chat_id))
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    if method == 'DELETE':
        reminder_id = params.get('id')
        cur.execute(
            f"DELETE FROM {SCHEMA}.reminders WHERE id = %s AND chat_id = %s",
            (int(reminder_id), int(chat_id))
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}
