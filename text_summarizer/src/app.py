import argparse
import configparser
import json
import logging.config
import os

import nltk
from kafka import KafkaConsumer, KafkaProducer
from sumy.nlp.tokenizers import Tokenizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.summarizers.text_rank import TextRankSummarizer

parser = argparse.ArgumentParser(description='Params')
parser.add_argument('--config_path', action='append', help='Path to config.ini file (or multiple file)')
parser.add_argument('--log_path', help='Path to log.ini')
args = parser.parse_args()
config_paths = args.config_path or ['./config/config.ini']
log_path = args.log_path or ['./config/log.ini']
config = configparser.ConfigParser(os.environ)
for config_path in config_paths:
    config.read(config_path)
config_section = 'DEFAULT'

logging.config.fileConfig(log_path)
logger = logging.getLogger('textSummarizer')

try:
    nltk.download('punkt')

    bootstrap_servers = config.get(config_section, 'kafka.server')

    consumer = KafkaConsumer(
        config.get(config_section, 'kafka.consumer.topic'),
        bootstrap_servers=bootstrap_servers,
        group_id=config.get(config_section, 'kafka.consumer.group-id'),
        auto_offset_reset=config.get(config_section, 'kafka.consumer.auto-offset-reset')
    )

    producer = KafkaProducer(
        bootstrap_servers=bootstrap_servers,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )

    logger.info('Application started')

    while True:
        msg = next(consumer)
        if msg:
            try:
                request = json.loads(msg.value.decode('utf-8'))
            except Exception as e:
                logger.error(e)
                continue

            req_id = request['id']
            in_text = request['text']
            out_text = None
            error = False

            logger.info(f'Get request with id {req_id}')
            logger.debug(f'Content of request with id {req_id}: {in_text}')

            try:
                summary = TextRankSummarizer()(
                    PlaintextParser.from_string(request['text'], Tokenizer('russian')).document, 2)

                logger.debug(f'Summary for id {req_id}: {summary}')

                out_text = ''
                for sentence in summary:
                    out_text += str(sentence)

                logger.debug(f'Result for id {req_id}: {out_text}')
            except Exception as e:
                logger.error(f'Error while process request with id {req_id}')
                logger.error(e)
                error = True

            producer.send(config.get(config_section, 'kafka.producer.topic'), {
                'id': req_id,
                'text': out_text,
                'error': error
            })
            logger.info(f'Result for id {req_id} is sent')
except Exception as e:
    logger.error(e)