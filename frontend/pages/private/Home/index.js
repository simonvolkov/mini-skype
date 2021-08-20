import React, { useMemo, useState } from 'react';
import { Tabs, Col, Typography } from 'components';
import { observer, axios } from 'helpers';
import { useStore, useSocket } from 'helpers/hooks';
import { Contacts, Chats } from './tabs';
import Chat from './Chat';
import s from './index.scss';

export default observer(function Home() {
  const user = useStore('user');
  const chats = useSocket('chats', { userId: user.data._id });
  const [slide, setSlide] = useState('chats');
  const [selectUser, setSelectUser] = useState(null);
  const [selectChatId, setSelectChatId] = useState('');

  const selectChat = useMemo(()=> {
    const chat = chats?.data?.find(chat=> {
      if (selectChatId) return chat._id === selectChatId;
      if (selectUser) {
        return chat.users.find(u=> u._id === user.data._id) &&
          chat.users.find(u=> u._id === selectUser._id);
      }
    });

    if (chat) return chat;
    if (!chat && selectUser) {
      return {
        _id: 'draft',
        type: 'private',
        users: [user.data, selectUser]
      };
    }
    return null;
  }, [
    selectChatId,
    selectUser,
    JSON.stringify(chats)
  ]);

  async function onSendMessage(text) {
    if (selectChat._id === 'draft') {
      await axios.post('chats/create', {
        userIds: [user.data._id, selectUser._id],
        type: 'private'
      });
    }

    await axios.post('messages/create', {
      userId: user.data._id,
      chatId: selectChat._id,
      text
    });
  }

  function onChangeSlide(slide) {
    setSelectUser(null);
    setSlide(slide);
  }

  return (
    <div className={s.row}>
      <Col>
        <Tabs
          className={s.tabs}
          activeKey={slide}
          centered={true}
          tabBarGutter={0}
          onChange={onChangeSlide}
        >
          <Tabs.TabPane
            key="contacts"
            tab={<div className={s.tab}>Contacts</div>}
          >
            <Contacts
              value={selectUser}
              onSelect={setSelectUser}
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            key="chats"
            tab={<div className={s.tab}>Chats</div>}
          >
            <Chats
              chats={chats.data}
              value={selectChatId}
              onSelect={setSelectChatId}
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            key="settings"
            tab={<div className={s.tab}>Settings</div>}
          >
            Settings
          </Tabs.TabPane>
        </Tabs>
      </Col>

      <Col className={s.content}>
        {
          !selectChat &&
          <Col className={s.welcome}>
            <Col className={s.welcomeCase}>
              <Typography.Text className={s.welcomeText}>Welcome! {user.data.login}</Typography.Text>
              <Typography.Text className={s.welcomeText}>Select a chat to start messaging</Typography.Text>
            </Col>
          </Col>
        }

        {
          !!selectChat &&
          <Chat
            chat={selectChat}
            onSend={onSendMessage}
          />
        }
      </Col>
    </div>
  );
});
