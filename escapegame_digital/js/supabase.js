(function(){

  if(!window.REBOND_CONFIG){
    throw new Error(
      "Le fichier config.js doit être chargé avant supabase.js."
    );
  }

  if(!window.supabase){
    throw new Error(
      "La bibliothèque Supabase n’a pas été chargée."
    );
  }

  const config =
    window.REBOND_CONFIG;

  const client =
    window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseKey
    );

  async function creerSession({
    ecole,
    classe,
    email,
    date,
    enseignant,
    nombreEleves
  }){

    const { data, error } =
      await client.rpc(
        "rebond_create_session",
        {
          p_school_name: ecole,
          p_class_name: classe,
          p_organizer_email: email,
          p_session_date: date,
          p_teacher_name: enseignant,
          p_student_count: nombreEleves
        }
      );

    if(error){
      throw error;
    }

    if(!data || !data[0]){
      throw new Error(
        "La session n’a pas pu être créée."
      );
    }

    return {
      sessionId:
        data[0].session_id,

      code:
        data[0].session_code,

      cleGestion:
        data[0].management_token
    };

  }

  async function rejoindreSession({
    code,
    equipe
  }){

    const { data, error } =
      await client.rpc(
        "rebond_join_session",
        {
          p_session_code: code,
          p_team_name: equipe
        }
      );

    if(error){
      throw error;
    }

    if(!data || !data[0]){
      throw new Error(
        "Impossible de rejoindre cette session."
      );
    }

    const participation = {
      equipeId:
        data[0].team_id,

      cleValidation:
        data[0].completion_token,

      nomEquipe:
        equipe,

      codeSession:
        code,

      ecole:
        data[0].school_name,

      classe:
        data[0].class_name,

      date:
        data[0].session_date
    };

    localStorage.setItem(
      "rebondCurrentTeam",
      JSON.stringify(participation)
    );

    return participation;

  }

  async function terminerPartie(){

    const donnees =
      localStorage.getItem(
        "rebondCurrentTeam"
      );

    if(!donnees){
      throw new Error(
        "Aucune équipe n’est enregistrée sur cet appareil."
      );
    }

    const participation =
      JSON.parse(donnees);

    const { data, error } =
      await client.rpc(
        "rebond_complete_team",
        {
          p_team_id:
            participation.equipeId,

          p_completion_token:
            participation.cleValidation
        }
      );

    if(error){
      throw error;
    }

    if(data !== true){
      throw new Error(
        "La validation de la partie a échoué."
      );
    }

    return true;

  }

  async function chargerSuivi({
    code,
    cleGestion
  }){

    const { data, error } =
      await client.rpc(
        "rebond_session_dashboard_v2",
        {
          p_session_code:
            code,

          p_management_token:
            cleGestion
        }
      );

    if(error){
      throw error;
    }

    return data || [];

  }

  async function retrouverSession({
    code
  }){

    const codeNettoye =
      String(code || "")
        .trim()
        .toUpperCase();

    if(!codeNettoye){
      throw new Error(
        "Saisis un code de session."
      );
    }

    const { data, error } =
      await client.rpc(
        "rebond_retrouver_session",
        {
          p_session_code:
            codeNettoye
        }
      );

    if(error){
      console.error(error);

      throw new Error(
        "Impossible de retrouver cette session."
      );
    }

    if(!data || !data[0]){
      throw new Error(
        "Ce code de session est introuvable."
      );
    }

    return {
      code:
        data[0].session_code,

      cleGestion:
        data[0].management_token
    };

  }

  function lireEquipeCourante(){

    const donnees =
      localStorage.getItem(
        "rebondCurrentTeam"
      );

    if(!donnees){
      return null;
    }

    try{
      return JSON.parse(donnees);
    }
    catch(error){
      return null;
    }

  }

  window.REBOND_DB = {
    client,
    creerSession,
    rejoindreSession,
    terminerPartie,
    chargerSuivi,
    retrouverSession,
    lireEquipeCourante
  };

})();
