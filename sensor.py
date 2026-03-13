import argparse
import json
import pika

from time import sleep, time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("id", type=str,
                        help="Device id.")
    parser.add_argument("-a", "--host", type=str, default="localhost:5671",
                        help="Address to the RabbitMQ server.")
    parser.add_argument("-i", "--interval", type=int, default=10 * 60,
                        help="Interval in seconds between readings.")
    parser.add_argument("-d", "--data", type=str, default="./sensor.csv",
                        help="Path to the readings data CSV.")
    params = parser.parse_args()

    print("Creating connection to:", params.id)
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=params.host))
    try:
        channel = connection.channel()
        channel.queue_declare(queue="sd")
        print("Connection created.")

        with open(params.data, "r") as file:
            print("Loading data from:", params.data)
            readings = file.readlines()
            for line in readings:
                raw_data = {
                    "timestamp": time(),
                    "device_id": params.id,
                    "measurement_value": float(line.strip()),
                }
                data = json.dumps(raw_data).encode()
                try:
                    print("Sending:", data)
                    channel.basic_publish(exchange='', routing_key="sd", body=data)
                except Exception as ex:
                    print("Error occurred:", ex)
                sleep(params.interval)
    finally:
        print("Closing the connection.")
        connection.close()


if __name__ == '__main__':
    main()
