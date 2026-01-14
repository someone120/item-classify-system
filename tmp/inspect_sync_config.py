import sqlite3, json
conn = sqlite3.connect(r'.\\tmp\\android_item_classify_system.db')
cur = conn.cursor()
cur.execute('select sync_type, enabled, config, last_sync_time, created_at, updated_at from sync_config order by updated_at desc')
rows = cur.fetchall()
print('rows:', len(rows))
for row in rows:
    sync_type, enabled, config, last_sync_time, created_at, updated_at = row
    print('sync_type=', sync_type, 'enabled=', enabled, 'last_sync_time=', last_sync_time, 'created_at=', created_at, 'updated_at=', updated_at)
    try:
        data = json.loads(config)
        safe = {k: ('***' if k in ('password','secret_key') else v) for k, v in data.items()}
        print('config keys:', sorted(data.keys()))
        print('config:', safe)
    except Exception as e:
        print('config parse error:', e)
