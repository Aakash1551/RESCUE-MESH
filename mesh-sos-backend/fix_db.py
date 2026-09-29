import sqlite3

try:
    conn = sqlite3.connect('meshsos.db')
    cur = conn.cursor()
    cur.execute('DELETE FROM sos_packets WHERE latitude = 0 AND longitude = 0')
    conn.commit()
    print("Deleted", cur.rowcount, "invalid SOS signals with 0,0 location.")
except Exception as e:
    print("Error:", e)
finally:
    if 'conn' in locals():
        conn.close()
